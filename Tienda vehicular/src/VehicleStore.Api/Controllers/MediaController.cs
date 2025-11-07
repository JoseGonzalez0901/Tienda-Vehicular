using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleStore.Core.Entities;
using VehicleStore.Infrastructure.Data;

namespace VehicleStore.Api.Controllers;

[ApiController]
[Route("api/vehicles/admin/media")]
[Authorize(Roles = "Admin")]
public class MediaController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private static readonly string[] ImageTypes = ["image/jpeg", "image/png", "image/webp"];
    private static readonly string[] VideoTypes = ["video/mp4", "video/webm"];
    private static readonly string[] ModelTypes = ["model/gltf-binary", "model/gltf+json", "application/octet-stream"]; // glb/gltf

    public record UploadMediaDto(int VehicleId, IFormFile File, string Type, bool IsCover = false);
    public record ReorderDto(List<ReorderItem> Items);
    public record ReorderItem(int MediaId, int Order);

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50_000_000)]
    public async Task<IActionResult> Upload([FromForm] UploadMediaDto dto, CancellationToken ct)
    {
        var v = await db.Vehicles.Include(x => x.Media).FirstOrDefaultAsync(x => x.Id == dto.VehicleId, ct);
        if (v is null) return NotFound("Vehicle not found");

        var contentType = dto.File.ContentType.ToLowerInvariant();
        if (dto.Type == "image" && !ImageTypes.Contains(contentType)) return BadRequest("Tipo de imagen no válido");
        if (dto.Type == "video" && !VideoTypes.Contains(contentType)) return BadRequest("Tipo de video no válido");
        if (dto.Type == "model3d" && !ModelTypes.Contains(contentType)) return BadRequest("Tipo de modelo 3D no válido");

        if (dto.Type == "image" && v.Media.Count(m => m.Type == "image") >= 5) return BadRequest("Máximo 5 imágenes");
        if (dto.Type == "video" && v.Media.Any(m => m.Type == "video")) return BadRequest("Máximo 1 video");
        if (dto.Type == "model3d" && v.Media.Any(m => m.Type == "model3d")) return BadRequest("Máximo 1 modelo 3D");

        var uploads = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(uploads);
        var ext = Path.GetExtension(dto.File.FileName);
        var fname = $"{Guid.NewGuid():N}{ext}";
        var full = Path.Combine(uploads, fname);
        await using (var fs = System.IO.File.Create(full))
            await dto.File.CopyToAsync(fs, ct);

        var url = $"/uploads/{fname}";
        var order = v.Media.Where(m => m.Type == dto.Type).Select(m => m.Order).DefaultIfEmpty(0).Max() + 1;

        if (dto.IsCover)
        {
            foreach (var m in v.Media.Where(m => m.Type == "image")) m.IsCover = false;
        }

        var media = new MediaAsset { VehicleId = dto.VehicleId, Type = dto.Type, Url = url, Order = order, IsCover = dto.IsCover };
        db.MediaAssets.Add(media);
        await db.SaveChangesAsync(ct);

        return Created(url, new { media.Id, media.Type, media.Url, media.Order, media.IsCover });
    }

    // Marcar una imagen como portada
    [HttpPut("{vehicleId:int}/cover/{mediaId:int}")]
    public async Task<IActionResult> SetCover(int vehicleId, int mediaId, CancellationToken ct)
    {
        var medias = await db.MediaAssets.Where(m => m.VehicleId == vehicleId && m.Type == "image").ToListAsync(ct);
        if (medias.Count == 0) return NotFound("Sin imágenes");
        foreach (var m in medias) m.IsCover = (m.Id == mediaId);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Reordenar media (imagen/video/model3d)
    [HttpPut("{vehicleId:int}/reorder")]
    public async Task<IActionResult> Reorder(int vehicleId, [FromBody] ReorderDto dto, CancellationToken ct)
    {
        var ids = dto.Items.Select(i => i.MediaId).ToHashSet();
        var medias = await db.MediaAssets.Where(m => m.VehicleId == vehicleId && ids.Contains(m.Id)).ToListAsync(ct);
        if (medias.Count == 0) return NotFound("Media no encontrada");

        foreach (var m in medias)
        {
            var desired = dto.Items.First(i => i.MediaId == m.Id);
            m.Order = desired.Order;
        }
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Eliminar un media
    [HttpDelete("{vehicleId:int}/{mediaId:int}")]
    public async Task<IActionResult> Delete(int vehicleId, int mediaId, CancellationToken ct)
    {
        var media = await db.MediaAssets.FirstOrDefaultAsync(m => m.VehicleId == vehicleId && m.Id == mediaId, ct);
        if (media is null) return NotFound();

        db.MediaAssets.Remove(media);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
