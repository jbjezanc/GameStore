using System.Text.Json;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace GameStore.Api.Messaging;

public class RabbitMqPriceChangeEventPublisher(
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqPriceChangeEventPublisher> logger)
    : IPriceChangeEventPublisher
{
    static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public async Task PublishAsync(PriceChangedEvent priceChangedEvent, CancellationToken cancellationToken = default)
    {
        var rabbitMqOptions = options.Value;

        if (!rabbitMqOptions.Enabled)
        {
            return;
        }

        try
        {
            var factory = RabbitMqConnectionFactoryBuilder.Create(rabbitMqOptions);

            await using IConnection connection = await factory.CreateConnectionAsync(
                clientProvidedName: "gamestore-api-price-publisher",
                cancellationToken: cancellationToken
            );

            await using IChannel channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);

            await RabbitMqTopology.EnsureDeclaredAsync(channel, rabbitMqOptions, cancellationToken);

            byte[] body = JsonSerializer.SerializeToUtf8Bytes(priceChangedEvent, SerializerOptions);

            await channel.BasicPublishAsync(
                exchange: rabbitMqOptions.Exchange,
                routingKey: rabbitMqOptions.RoutingKey,
                body: body,
                cancellationToken: cancellationToken
            );
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish the price change event for game {GameId}", priceChangedEvent.GameId);
        }
    }
}
