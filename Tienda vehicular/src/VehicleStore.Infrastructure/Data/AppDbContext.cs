using Microsoft.EntityFrameworkCore;
using VehicleStore.Core.Entities;

namespace VehicleStore.Infrastructure.Data
{
    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        public DbSet<Brand> Brands => Set<Brand>();
        public DbSet<VehicleModel> VehicleModels => Set<VehicleModel>();
        public DbSet<Vehicle> Vehicles => Set<Vehicle>();
        public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
        public DbSet<VehicleSpec> VehicleSpecs => Set<VehicleSpec>();  // ← FALTABA
        public DbSet<Lead> Leads => Set<Lead>();
        public DbSet<User> Users => Set<User>();

        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            // --- Brand ---
            b.Entity<Brand>()
                .HasIndex(x => x.Name)
                .IsUnique();

            // --- VehicleModel ---
            b.Entity<VehicleModel>()
                .HasOne(m => m.Brand)
                .WithMany(br => br.Models)
                .HasForeignKey(m => m.BrandId)
                .OnDelete(DeleteBehavior.Cascade);

            // (opcional pero recomendable) Unicidad de modelo por marca
            b.Entity<VehicleModel>()
                .HasIndex(m => new { m.BrandId, m.Name })
                .IsUnique();

            // --- Vehicle ---
            b.Entity<Vehicle>()
                .Property(v => v.Price)
                .HasPrecision(18, 2);

            b.Entity<Vehicle>()
                .HasOne(v => v.Model)
                .WithMany(m => m.Vehicles)
                .HasForeignKey(v => v.VehicleModelId)     // ajusta si tu FK se llama distinto
                .OnDelete(DeleteBehavior.Cascade);

            b.Entity<Vehicle>()
                .HasIndex(x => new { x.Price, x.Year });

            // --- MediaAsset (1:N Vehicle -> MediaAssets) ---
            b.Entity<MediaAsset>()
                .HasOne(ma => ma.Vehicle)
                .WithMany(v => v.Media)
                .HasForeignKey(ma => ma.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            b.Entity<MediaAsset>()
                .HasIndex(x => new { x.VehicleId, x.Order });

            // --- VehicleSpec (1:N Vehicle -> Specs) ---
            b.Entity<VehicleSpec>()
                .HasOne(s => s.Vehicle)
                .WithMany(v => v.Specs)
                .HasForeignKey(s => s.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            // Búsquedas rápidas por clave y evitar duplicados de key por vehículo
            b.Entity<VehicleSpec>()
                .HasIndex(s => new { s.VehicleId, s.Key })
                .IsUnique();

            // --- User ---
            b.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }
}
