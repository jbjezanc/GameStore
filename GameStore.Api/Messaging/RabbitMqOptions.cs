namespace GameStore.Api.Messaging;

public class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";

    public bool Enabled { get; set; }

    public string Uri { get; set; } = "amqp://guest:guest@localhost:5672";

    public string Exchange { get; set; } = "gamestore.events";

    public string Queue { get; set; } = "gamestore.price-history";

    public string RoutingKey { get; set; } = "game.price.changed";
}
