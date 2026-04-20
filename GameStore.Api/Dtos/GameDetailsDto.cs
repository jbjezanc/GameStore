namespace GameStore.Api.Dtos;

// A DTO is a contract between the client and server since it represents
// a shared agrement about how data will be trasferred and used.

public record GameDetailsDto(
    int Id,
    string Name,
    int GenreId,
    decimal Price,
    DateOnly ReleaseDate
);
