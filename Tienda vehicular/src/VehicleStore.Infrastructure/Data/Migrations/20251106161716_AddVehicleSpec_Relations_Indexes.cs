using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleStore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleSpec_Relations_Indexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VehicleSpecs_VehicleId",
                table: "VehicleSpecs");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModels_BrandId",
                table: "VehicleModels");

            migrationBuilder.AlterColumn<string>(
                name: "Key",
                table: "VehicleSpecs",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "VehicleModels",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleSpecs_VehicleId_Key",
                table: "VehicleSpecs",
                columns: new[] { "VehicleId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModels_BrandId_Name",
                table: "VehicleModels",
                columns: new[] { "BrandId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VehicleSpecs_VehicleId_Key",
                table: "VehicleSpecs");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModels_BrandId_Name",
                table: "VehicleModels");

            migrationBuilder.AlterColumn<string>(
                name: "Key",
                table: "VehicleSpecs",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "VehicleModels",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleSpecs_VehicleId",
                table: "VehicleSpecs",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModels_BrandId",
                table: "VehicleModels",
                column: "BrandId");
        }
    }
}
