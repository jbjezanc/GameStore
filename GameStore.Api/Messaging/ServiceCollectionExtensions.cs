using Microsoft.Extensions.Options;

namespace GameStore.Api.Messaging;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddRabbitMqPriceHistoryMessaging(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services
            .AddOptions<RabbitMqOptions>()
            .Bind(configuration.GetSection(RabbitMqOptions.SectionName))
            .ValidateOnStart();

        services.AddSingleton<IPriceChangeEventPublisher, RabbitMqPriceChangeEventPublisher>();
        services.AddHostedService<RabbitMqPriceChangeConsumerService>();

        return services;
    }
}
