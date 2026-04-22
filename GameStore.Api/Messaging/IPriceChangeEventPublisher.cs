namespace GameStore.Api.Messaging;

public interface IPriceChangeEventPublisher
{
    Task PublishAsync(PriceChangedEvent priceChangedEvent, CancellationToken cancellationToken = default);
}
