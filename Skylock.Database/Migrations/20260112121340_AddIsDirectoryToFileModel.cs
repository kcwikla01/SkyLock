using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Skylock.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDirectoryToFileModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDirectory",
                table: "Files",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDirectory",
                table: "Files");
        }
    }
}
