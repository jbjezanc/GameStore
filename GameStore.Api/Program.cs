using GameStore.Api.Data;
using GameStore.Api.Endpoints;
using GameStore.Api.Messaging;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddValidation();

builder.AddGameStoreDb();
builder.Services.AddRabbitMqPriceHistoryMessaging(builder.Configuration);

var app = builder.Build();

app.MapGamesEndpoints();
app.MapGenresEndpoints();

app.MigrateDb();

app.Run();
