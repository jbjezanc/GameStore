namespace GameStore.Api.Models;

public class PriceHistory
{
    public int Id { get; set; }

    public Guid EventId { get; set; }

    public int GameId { get; set; }

    public Game? Game { get; set; }

    public decimal OldPrice { get; set; }

    public decimal NewPrice { get; set; }

    public DateTime ChangedAtUtc { get; set; }
}
