using Microsoft.AspNetCore.Mvc;

namespace VehicleStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FinancingController : ControllerBase
{
    // GET /api/financing/quote?vehiclePrice=25000&downPayment=5000&termMonths=60&annualRate=0.18
    [HttpGet("quote")]
    public IActionResult Quote(decimal vehiclePrice, decimal downPayment, int termMonths, decimal annualRate)
    {
        if (termMonths <= 0) return BadRequest("termMonths > 0");
        if (vehiclePrice <= 0 || downPayment < 0 || downPayment >= vehiclePrice) return BadRequest("Revisa montos.");

        var P = vehiclePrice - downPayment;
        var i = annualRate / 12m; // tasa mensual
       // var A = (P * i) / (1 - Math.Pow(1 + (double)i, -termMonths));
        var A = (1 - Math.Pow(1 + (double)i, -termMonths));

        return Ok(new
        {
            principal = P,
            monthlyPayment = Math.Round((decimal)A, 2),
            termMonths,
            annualRate
        });
    }
}
