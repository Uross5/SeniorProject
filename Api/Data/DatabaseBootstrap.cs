using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace Agppa.Api.Data;

public static class DatabaseBootstrap
{
    /// <summary>
    /// Creates the database from the connection string if it does not exist (MySQL only).
    /// </summary>
    public static void EnsureDatabaseCreated(string connectionString, ILogger logger)
    {
        var csb = new MySqlConnectionStringBuilder(connectionString);
        var dbName = csb.Database;
        if (string.IsNullOrWhiteSpace(dbName))
            return;
        if (!Regex.IsMatch(dbName, @"^[a-zA-Z0-9_]+$"))
            throw new InvalidOperationException("Database name in connection string must be alphanumeric or underscore.");

        csb.Database = "";
        using var conn = new MySqlConnection(csb.ConnectionString);
        conn.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText =
            $"CREATE DATABASE IF NOT EXISTS `{dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";
        cmd.ExecuteNonQuery();
        logger.LogInformation("Ensured MySQL database '{Database}' exists.", dbName);
    }
}
