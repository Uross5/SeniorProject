using Agppa.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("No DefaultConnection in appsettings.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 36)))
        .UseSnakeCaseNamingConvention();
});

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

app.UseCors();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.Run();
