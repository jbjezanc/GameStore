namespace GameStore.Api.Messaging;

public record PriceChangedEvent(
    Guid EventId,
    int GameId,
    decimal OldPrice,
    decimal NewPrice,
    DateTime ChangedAtUtc
);
