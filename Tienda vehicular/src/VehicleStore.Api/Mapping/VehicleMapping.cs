// Mapping/VehicleMapping.cs
using System.Linq;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using VehicleStore.Core.Entities;

public static class VehicleMapping
{
    static string? ToAbs(string? baseUrl, string? url)
        => string.IsNullOrWhiteSpace(url) ? null :
           url!.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? url :
           $"{baseUrl?.TrimEnd('/')}/{url!.TrimStart('/')}";

    static int? ParseInt(string? v) => int.TryParse(v, out var n) ? n : null;

    static List<string>? SplitList(string? v)
        => string.IsNullOrWhiteSpace(v) ? null
           : v!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    public static VehicleListItemDto ToListItemDto(this Vehicle v, string? baseUrl)
    {
        var brand = v.Model.Brand.Name;
        var model = v.Model.Name;
        var title = $"{brand} {model}";
        var cover = v.Media
            .Where(m => m.Type == "image")
            .OrderByDescending(m => m.IsCover)
            .ThenBy(m => m.Order)
            .Select(m => ToAbs(baseUrl, m.Url))
            .FirstOrDefault();
        var specMap = (v.Specs ?? Array.Empty<VehicleSpec>())
        .GroupBy(s => s.Key, StringComparer.OrdinalIgnoreCase)
        .ToDictionary(g => g.Key, g => g.First().Value, StringComparer.OrdinalIgnoreCase);

        string? S(string key) => specMap.TryGetValue(key, out var val) ? val : null;
        var location = S("location");
        var condition = S("condition");
        var mileageKm = S("mileageKm");

        return new VehicleListItemDto
        {
            Id = v.Id,
            Title = title,
            Year = v.Year,
            Price = v.Price,
            CoverUrl = cover,
            Condition=condition,
            Location=location,
            MileageKm=mileageKm
        };
    }

    public static VehicleDetailDto ToDetailDto(this Vehicle v, string? baseUrl)
    {
        var brand = v.Model.Brand.Name;
        var model = v.Model.Name;
        var title = $"{brand} {model} {v.Year}";

        // --- Media ---
        var gallery = v.Media
            .Where(m => m.Type == "image")
            .OrderBy(m => m.Order)
            .Select(m => ToAbs(baseUrl, m.Url))
            .Where(u => !string.IsNullOrWhiteSpace(u))
            .Select(u => u!)
            .ToList();

        var video = v.Media
            .Where(m => m.Type == "video")
            .OrderBy(m => m.Order)
            .Select(m => ToAbs(baseUrl, m.Url))
            .FirstOrDefault();

        var model3d = v.Media
            .Where(m => m.Type == "model3d")
            .OrderBy(m => m.Order)
            .Select(m => ToAbs(baseUrl, m.Url))
            .FirstOrDefault();

        // --- Specs como diccionario (case-insensitive) ---
        var specMap = (v.Specs ?? Array.Empty<VehicleSpec>())
            .GroupBy(s => s.Key, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().Value, StringComparer.OrdinalIgnoreCase);

        string? S(string key) => specMap.TryGetValue(key, out var val) ? val : null;

        return new VehicleDetailDto
        {
            Id = v.Id,
            Title = title,
            Brand = brand,
            Model = model,
            Year = v.Year,
            Price = v.Price,

            Fuel = v.Fuel,
            Transmission = v.Transmission,
            Color = v.Color,
            Location = S("location"),
            Type = S("type"),
            Condition = S("condition"),
            Gallery = gallery,
            VideoUrl = video,
            Model3DUrl = model3d,

            Specs = new VehicleSpecsDto
            {
                Engine = S("engine"),
                Drive = S("drive"),
                PowerHp = ParseInt(S("powerHp") ?? S("hp")),
                TorqueNm = ParseInt(S("torqueNm") ?? S("torque")),
                Consumption = S("consumption") ?? S("economy") ?? null,
                Doors = ParseInt(S("doors")),
                Seats = ParseInt(S("seats")),
                MileageKm = ParseInt(S("mileageKm") ?? S("mileage")),
                Description = S("description"),
                Accessories = SplitList(S("accessories")) ?? new List<string>(),
                Features = SplitList(S("features")) ?? new List<string>()
            }
        };
    }

    public static IQueryable<Vehicle> WithAllIncludes(this IQueryable<Vehicle> q)
        => q.Include(v => v.Model).ThenInclude(m => m.Brand)
            .Include(v => v.Media)
            .Include(v => v.Specs);
}
