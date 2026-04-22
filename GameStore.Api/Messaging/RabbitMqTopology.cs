using RabbitMQ.Client;

namespace GameStore.Api.Messaging;

public static class RabbitMqTopology
{
    public static async Task EnsureDeclaredAsync(IChannel channel, RabbitMqOptions options, CancellationToken cancellationToken)
    {
        await channel.ExchangeDeclareAsync(
            exchange: options.Exchange,
            type: ExchangeType.Direct,
            durable: true,
            autoDelete: false,
            arguments: null,
            noWait: false,
            cancellationToken: cancellationToken
        );

        await channel.QueueDeclareAsync(
            queue: options.Queue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null,
            passive: false,
            noWait: false,
            cancellationToken: cancellationToken
        );

        await channel.QueueBindAsync(
            queue: options.Queue,
            exchange: options.Exchange,
            routingKey: options.RoutingKey,
            arguments: null,
            noWait: false,
            cancellationToken: cancellationToken
        );
    }
}
