using RabbitMQ.Client;

namespace GameStore.Api.Messaging;

public static class RabbitMqConnectionFactoryBuilder
{
    public static ConnectionFactory Create(RabbitMqOptions options)
    {
        return new ConnectionFactory
        {
            Uri = new Uri(options.Uri),
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
        };
    }
}
