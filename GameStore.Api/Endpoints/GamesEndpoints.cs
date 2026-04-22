using GameStore.Api.Data;
using GameStore.Api.Dtos;
using GameStore.Api.Messaging;
using GameStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameStore.Api.Endpoints;

public static class GamesEndpoints
{
    const string GetgameEndpointName = "GetGame";
    public static void MapGamesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/games");

        // GET /games
        group.MapGet("/", async (GameStoreContext dbContext)
            => await dbContext.Games
                            .Include(game => game.Genre)
                            .Select(game => new GameSummaryDto(
                                game.Id,
                                game.Name,
                                game.Genre!.Name,
                                game.Price,
                                game.ReleaseDate
                            ))
                            .AsNoTracking()
                            .ToListAsync());

        // GET /games/1
        group.MapGet("/{id}", async (int id, GameStoreContext dbContext) =>
        {
            var game = await dbContext.Games.FindAsync(id);

            return game is null ? Results.NotFound() : Results.Ok(
                new GameDetailsDto(
                    game.Id,
                    game.Name,
                    game.GenreId,
                    game.Price,
                    game.ReleaseDate
                )
            );
        })
        .WithName(GetgameEndpointName);

        // GET /games/1/price-history
        group.MapGet("/{id}/price-history", async (int id, GameStoreContext dbContext) =>
        {
            bool gameExists = await dbContext.Games.AnyAsync(game => game.Id == id);

            if (!gameExists)
            {
                return Results.NotFound();
            }

            var history = await dbContext.PriceHistories
                .Where(entry => entry.GameId == id)
                .OrderByDescending(entry => entry.ChangedAtUtc)
                .Select(entry => new PriceHistoryDto(
                    entry.OldPrice,
                    entry.NewPrice,
                    entry.ChangedAtUtc
                ))
                .AsNoTracking()
                .ToListAsync();

            return Results.Ok(history);
        });

        // POST /games
        group.MapPost("/", async (CreateGameDto newGame, GameStoreContext dbContext) =>
        {
            Game game = new()
            {
                Name = newGame.Name,
                GenreId = newGame.GenreId,
                Price = newGame.Price,
                ReleaseDate = newGame.ReleaseDate,
            };

            dbContext.Games.Add(game);
            await dbContext.SaveChangesAsync();

            GameDetailsDto gameDto = new(
                game.Id,
                game.Name,
                game.GenreId,
                game.Price,
                game.ReleaseDate
            );

            return Results.CreatedAtRoute(GetgameEndpointName, new { id = game.Id }, gameDto);
        });

        // PUT /games/1
        group.MapPut("/{id}", async (
            int id,
            UpdateGameDto updatedGame,
            GameStoreContext dbContext,
            IPriceChangeEventPublisher priceChangeEventPublisher,
            CancellationToken cancellationToken) =>
        {
            var existingGame = await dbContext.Games.FindAsync(new object[] { id }, cancellationToken);

            if (existingGame is null)
            {
                return Results.NotFound();
            }

            decimal previousPrice = existingGame.Price;

            existingGame.Name = updatedGame.Name;
            existingGame.GenreId = updatedGame.GenreId;
            existingGame.Price = updatedGame.Price;
            existingGame.ReleaseDate = updatedGame.ReleaseDate;

            await dbContext.SaveChangesAsync(cancellationToken);

            if (previousPrice != existingGame.Price)
            {
                await priceChangeEventPublisher.PublishAsync(
                    new PriceChangedEvent(
                        EventId: Guid.NewGuid(),
                        GameId: existingGame.Id,
                        OldPrice: previousPrice,
                        NewPrice: existingGame.Price,
                        ChangedAtUtc: DateTime.UtcNow
                    ),
                    cancellationToken
                );
            }

            return Results.NoContent();
        });

        // DELETE /games/1
        group.MapDelete("/{id}", async (int id, GameStoreContext dbContext) =>
        {
            await dbContext.Games
                        .Where(game => game.Id == id)
                        .ExecuteDeleteAsync();

            return Results.NoContent();
        });
    }

}
