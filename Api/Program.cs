using System.Security.Claims;
using System.Text;
using Agppa.Api.Data;
using Agppa.Api.Options;
using Agppa.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddSingleton<JwtTokenService>();

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration is missing.");
if (string.IsNullOrWhiteSpace(jwt.Secret) || jwt.Secret.Length < 32)
    throw new InvalidOperationException("Jwt:Secret must be at least 32 characters.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            RoleClaimType = ClaimTypes.Role,
        };
    });
builder.Services.AddAuthorization();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("No DefaultConnection in appsettings.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(
            connectionString,
            new MySqlServerVersion(new Version(8, 0, 36)),
            mySql => mySql.EnableRetryOnFailure(
                maxRetryCount: 6,
                maxRetryDelay: TimeSpan.FromSeconds(15),
                errorNumbersToAdd: null))
        .UseSnakeCaseNamingConvention();
});

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
DatabaseBootstrap.EnsureDatabaseCreated(connectionString, startupLogger);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");
    await DbSeeder.SeedSuperAdminAsync(db, cfg, logger);
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.Run();
