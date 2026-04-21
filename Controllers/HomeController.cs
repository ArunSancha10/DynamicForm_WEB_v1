using DynamicMaster.WEB.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace DynamicMaster.WEB.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IWebHostEnvironment _env;

        public HomeController(ILogger<HomeController> logger, IWebHostEnvironment env)
        {
            _logger = logger;
            _env = env;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        [HttpPost]
        public IActionResult SaveDynamicForm([FromBody] DynamicFormDto model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.FormName))
                return BadRequest("Invalid data");

            try
            {
                string folderPath = Path.Combine(_env.WebRootPath, "json", "Form");

                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                // ✅ Clean form name
                string cleanFormName = model.FormName.Replace("\n", "").Replace("\r", "").Trim();
                string safeFormName = GetSafeFileName(cleanFormName);

                // 🔥 Get version from JSON (NOT filename)
                var files = Directory.GetFiles(folderPath, "*.json");

                int version = 1;

                foreach (var file in files)
                {
                    try
                    {
                        var json = System.IO.File.ReadAllText(file);
                        var data = System.Text.Json.JsonSerializer.Deserialize<DynamicFormDto>(json);

                        if (data != null && data.FormName.Trim() == cleanFormName)
                        {
                            if (data.Version >= version)
                                version = data.Version + 1;
                        }
                    }
                    catch
                    {
                        // ignore invalid files
                    }
                }

                // ✅ Create file
                string fileName = $"{safeFormName}_{version}.json";
                string filePath = Path.Combine(folderPath, fileName);

                var dataToSave = new DynamicFormDto
                {
                    FormName = cleanFormName,
                    FileName = safeFormName,
                    Version = version,
                    FormJson = model.FormJson,
                    FormHtml = model.FormHtml,
                    CreatedDate = DateTime.Now
                };

                var jsonString = System.Text.Json.JsonSerializer.Serialize(dataToSave, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                System.IO.File.WriteAllText(filePath, jsonString, Encoding.UTF8);

                return Ok(new { message = "Saved successfully", version = version });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        private string GetSafeFileName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return "Form";

            // ✅ Remove line breaks
            name = name.Replace("\n", "").Replace("\r", "");

            // ✅ Remove emojis / special chars
            name = new string(name
                .Where(c => char.IsLetterOrDigit(c) || c == ' ')
                .ToArray());

            // ✅ Replace spaces with underscore
            name = name.Replace(" ", "_");

            return name;
        }

        public IActionResult ListForms()
        {
            string folderPath = Path.Combine(_env.WebRootPath, "json", "Form");

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            var files = Directory.GetFiles(folderPath, "*.json");

            var formList = new List<FormListDto>();

            foreach (var file in files)
            {
                var json = System.IO.File.ReadAllText(file);
                var data = System.Text.Json.JsonSerializer.Deserialize<DynamicFormDto>(json);

                string currentStage = "N/A";

                if (!string.IsNullOrEmpty(data.FormJson))
                {
                    try
                    {
                        var stages = System.Text.Json.JsonSerializer.Deserialize<List<StageDto>>(data.FormJson);

                        if (stages != null && stages.Count > 0)
                        {
                            // ✅ If using isCompleted (BEST APPROACH)
                            var stage = stages.FirstOrDefault(s => !s.isCompleted);

                            currentStage = stage?.name ?? "Completed";
                        }
                    }
                    catch
                    {
                        currentStage = "Error";
                    }
                }

                formList.Add(new FormListDto
                {
                    FormName = data.FormName,
                    FileName = Path.GetFileNameWithoutExtension(file),
                    CreatedDate = data.CreatedDate,
                    CurrentStage = currentStage
                });
            }

            return View(formList);
        }


        public IActionResult ViewForm(string formName)
        {
            string folderPath = Path.Combine(_env.WebRootPath, "json", "Form");

            var files = Directory.GetFiles(folderPath, $"{formName}_*.json");

            if (files.Length == 0)
                return Content("Form not found");

            // ✅ Get latest version correctly
            var latestFile = files
                .Select(f => new
                {
                    File = f,
                    Version = int.Parse(Path.GetFileNameWithoutExtension(f).Split('_').Last())
                })
                .OrderByDescending(x => x.Version)
                .First();

            var json = System.IO.File.ReadAllText(latestFile.File);
            var data = System.Text.Json.JsonSerializer.Deserialize<DynamicFormDto>(json);

            // 🔥 Deserialize stages
            var stages = System.Text.Json.JsonSerializer.Deserialize<List<StageDto>>(data.FormJson);

            // ✅ Find first incomplete stage
            int currentStageIndex = 0;

            if (stages != null && stages.Count > 0)
            {
                var index = stages.FindIndex(s => !s.isCompleted);
                currentStageIndex = index == -1 ? stages.Count - 1 : index;
            }

            bool isAllCompleted = stages != null && stages.All(s => s.isCompleted);

            // ✅ Send to view
            ViewBag.FormHtml = data.FormHtml;
            ViewBag.FormName = data.FormName;
            ViewBag.Version = data.Version;              // 🔥 REQUIRED
            ViewBag.CurrentStageIndex = currentStageIndex; // 🔥 NEW
            ViewBag.FormJson = data.FormJson;   // 🔥 ADD THIS
            ViewBag.IsAllCompleted = isAllCompleted;

            return View();
        }


        [HttpPost]
            public IActionResult SaveFormData([FromBody] SaveFormDataDto model)
            {
                if (model == null || string.IsNullOrWhiteSpace(model.FormName))
                    return BadRequest("Invalid data");

                try
                {
                    // 📁 Folder path
                    string folderPath = Path.Combine(_env.WebRootPath, "json", "FormData");

                    if (!Directory.Exists(folderPath))
                        Directory.CreateDirectory(folderPath);

                    // 🔥 Clean file name
                    string safeFormName = GetSafeFileName(model.FormName);

                    // 🔥 Version (multiple submissions)
                    int version = Directory.GetFiles(folderPath, $"{safeFormName}_*.json").Length + 1;

                    string fileName = $"{safeFormName}_{version}.json";
                    string filePath = Path.Combine(folderPath, fileName);

                    // 🔥 Save structure
                    var dataToSave = new
                    {
                        FormName = model.FormName,
                        Version = version,
                        SubmittedDate = DateTime.Now,
                        Data = model.Data
                    };

                    var jsonString = System.Text.Json.JsonSerializer.Serialize(dataToSave, new JsonSerializerOptions
                    {
                        WriteIndented = true
                    });

                    System.IO.File.WriteAllText(filePath, jsonString, Encoding.UTF8);

                    return Ok(new { message = "Form data saved successfully" });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, ex.Message);
                }
            }

        [HttpPost]
        public IActionResult UpdateStageCompletion([FromBody] UpdateStageDto model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.FormName))
                return BadRequest("Invalid data");

            try
            {
                string folderPath = Path.Combine(_env.WebRootPath, "json", "Form");

                var files = Directory.GetFiles(folderPath, "*.json");

                string matchedFile = null;
                DynamicFormDto matchedData = null;

                // 🔥 Find correct file using Version + FormName
                foreach (var file in files)
                {
                    var json = System.IO.File.ReadAllText(file);
                    var data = System.Text.Json.JsonSerializer.Deserialize<DynamicFormDto>(json);

                    if (data != null &&
                        data.Version == model.Version &&
                        data.FormName.Trim() == model.FormName.Trim())
                    {
                        matchedFile = file;
                        matchedData = data;
                        break;
                    }
                }

                if (matchedFile == null)
                    return NotFound("Form version not found");

                // 🔥 Deserialize stages
                var stages = System.Text.Json.JsonSerializer.Deserialize<List<StageDto>>(matchedData.FormJson);

                if (stages == null || model.StageIndex < 0 || model.StageIndex >= stages.Count)
                    return BadRequest("Invalid stage index");

                // ✅ UPDATE STAGE
                stages[model.StageIndex].isCompleted = true;

                // 🔥 SAVE VALUES (NEW)
                stages[model.StageIndex].values = model.StageValues ?? new Dictionary<string, JsonElement>();

                // 🔥 Save back
                matchedData.FormJson = System.Text.Json.JsonSerializer.Serialize(stages);

                var updatedJson = System.Text.Json.JsonSerializer.Serialize(matchedData, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                System.IO.File.WriteAllText(matchedFile, updatedJson, Encoding.UTF8);

                return Ok(new { message = "Stage saved successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

    }

}
