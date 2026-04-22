using System.Text.Json;
using GameStore.Api.Data;
using GameStore.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace GameStore.Api.Messaging;

public class RabbitMqPriceChangeConsumerService(
    IServiceScopeFactory scopeFactory,
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqPriceChangeConsumerService> logger)
    : BackgroundService
{
    static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    IConnection? connection;
    IChannel? channel;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var rabbitMqOptions = options.Value;

        if (!rabbitMqOptions.Enabled)
        {
            logger.LogInformation("RabbitMQ price history consumer is disabled.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await StartConsumerAsync(rabbitMqOptions, stoppingToken);
                return;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Unable to start the RabbitMQ price history consumer. Retrying in 10 seconds.");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }
    }

    async Task StartConsumerAsync(RabbitMqOptions rabbitMqOptions, CancellationToken stoppingToken)
    {
        var factory = RabbitMqConnectionFactoryBuilder.Create(rabbitMqOptions);

        connection = await factory.CreateConnectionAsync(
            clientProvidedName: "gamestore-api-price-history-consumer",
            cancellationToken: stoppingToken
        );

        channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await RabbitMqTopology.EnsureDeclaredAsync(channel, rabbitMqOptions, stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, args) => await HandlePriceChangedAsync(args, stoppingToken);

        await channel.BasicConsumeAsync(
            queue: rabbitMqOptions.Queue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken
        );

        logger.LogInformation("RabbitMQ price history consumer is listening on queue {QueueName}", rabbitMqOptions.Queue);

        await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
    }

    async Task HandlePriceChangedAsync(BasicDeliverEventArgs args, CancellationToken stoppingToken)
    {
        if (channel is null)
        {
            return;
        }

        try
        {
            var priceChangedEvent = JsonSerializer.Deserialize<PriceChangedEvent>(args.Body.Span, SerializerOptions)
                ?? throw new InvalidOperationException("The received price change event payload was empty.");

            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<GameStoreContext>();

            bool alreadyProcessed = await dbContext.PriceHistories
                .AnyAsync(history => history.EventId == priceChangedEvent.EventId, stoppingToken);

            if (!alreadyProcessed)
            {
                dbContext.PriceHistories.Add(new PriceHistory
                {
                    EventId = priceChangedEvent.EventId,
                    GameId = priceChangedEvent.GameId,
                    OldPrice = priceChangedEvent.OldPrice,
                    NewPrice = priceChangedEvent.NewPrice,
                    ChangedAtUtc = priceChangedEvent.ChangedAtUtc
                });

                await dbContext.SaveChangesAsync(stoppingToken);
            }

            await channel.BasicAckAsync(args.DeliveryTag, multiple: false, cancellationToken: stoppingToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process a RabbitMQ price change event.");
            await channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: false, cancellationToken: stoppingToken);
        }
    }

    public override void Dispose()
    {
        channel?.Dispose();
        connection?.Dispose();
        base.Dispose();
    }
}
