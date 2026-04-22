namespace GameStore.Api.Dtos;

public record PriceHistoryDto(
    decimal OldPrice,
    decimal NewPrice,
    DateTime ChangedAtUtc
);
