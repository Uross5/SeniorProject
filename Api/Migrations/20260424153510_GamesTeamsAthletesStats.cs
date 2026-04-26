using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Agppa.Api.Migrations
{
    /// <inheritdoc />
    public partial class GamesTeamsAthletesStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "INSERT INTO teams (team_name, coach_name) SELECT 'Default team', NULL " +
                "WHERE NOT EXISTS (SELECT 1 FROM teams LIMIT 1);");

            migrationBuilder.AddColumn<int>(
                name: "team_id",
                table: "athletes",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE athletes AS a " +
                "CROSS JOIN (SELECT team_id AS tid FROM teams ORDER BY team_id LIMIT 1) AS t " +
                "SET a.team_id = t.tid WHERE a.team_id IS NULL;");

            migrationBuilder.AlterColumn<int>(
                name: "team_id",
                table: "athletes",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "games",
                columns: table => new
                {
                    game_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    home_team_id = table.Column<int>(type: "int", nullable: false),
                    away_team_id = table.Column<int>(type: "int", nullable: false),
                    home_score = table.Column<int>(type: "int", nullable: false),
                    away_score = table.Column<int>(type: "int", nullable: false),
                    played_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_games", x => x.game_id);
                    table.ForeignKey(
                        name: "fk_games_teams_away_team_id",
                        column: x => x.away_team_id,
                        principalTable: "teams",
                        principalColumn: "team_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_games_teams_home_team_id",
                        column: x => x.home_team_id,
                        principalTable: "teams",
                        principalColumn: "team_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "athlete_game_stats",
                columns: table => new
                {
                    athlete_game_stat_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    game_id = table.Column<int>(type: "int", nullable: false),
                    athlete_id = table.Column<int>(type: "int", nullable: false),
                    points = table.Column<int>(type: "int", nullable: false),
                    rebounds = table.Column<int>(type: "int", nullable: false),
                    assists = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_athlete_game_stats", x => x.athlete_game_stat_id);
                    table.ForeignKey(
                        name: "fk_athlete_game_stats_athletes_athlete_id",
                        column: x => x.athlete_id,
                        principalTable: "athletes",
                        principalColumn: "athlete_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_athlete_game_stats_games_game_id",
                        column: x => x.game_id,
                        principalTable: "games",
                        principalColumn: "game_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "ix_athletes_team_id",
                table: "athletes",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "ix_athlete_game_stats_athlete_id",
                table: "athlete_game_stats",
                column: "athlete_id");

            migrationBuilder.CreateIndex(
                name: "ix_athlete_game_stats_game_id_athlete_id",
                table: "athlete_game_stats",
                columns: new[] { "game_id", "athlete_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_games_away_team_id",
                table: "games",
                column: "away_team_id");

            migrationBuilder.CreateIndex(
                name: "ix_games_home_team_id",
                table: "games",
                column: "home_team_id");

            migrationBuilder.AddForeignKey(
                name: "fk_athletes_teams_team_id",
                table: "athletes",
                column: "team_id",
                principalTable: "teams",
                principalColumn: "team_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_athletes_teams_team_id",
                table: "athletes");

            migrationBuilder.DropTable(
                name: "athlete_game_stats");

            migrationBuilder.DropTable(
                name: "games");

            migrationBuilder.DropIndex(
                name: "ix_athletes_team_id",
                table: "athletes");

            migrationBuilder.DropColumn(
                name: "team_id",
                table: "athletes");
        }
    }
}
