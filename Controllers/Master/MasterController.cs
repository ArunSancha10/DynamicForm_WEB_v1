using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;

namespace DynamicMaster.WEB.Controllers
{
    [Route("dynamic-master")]
    public class MasterController : Controller
    {
        private readonly string _jsonPath =
            @"D:\Arun\Dynamic Master\WEB\DynamicMaster.WEB\wwwroot\json\HeadingName.json";

        [HttpGet("get")]
        public IActionResult GetMaster()
        {
            if (!System.IO.File.Exists(_jsonPath))
                return Json(new object[] { });

            var json = System.IO.File.ReadAllText(_jsonPath);

            if (string.IsNullOrWhiteSpace(json))
                return Json(new object[] { });

            return Content(json, "application/json");
        }


        [HttpPost("save")]
        public IActionResult SaveMaster([FromBody] object data)
        {
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            System.IO.File.WriteAllText(_jsonPath, json);
            return Ok(new { success = true });
        }
    }
}
