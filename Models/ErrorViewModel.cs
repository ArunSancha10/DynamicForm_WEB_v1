using System.Text.Json;

namespace DynamicMaster.WEB.Models
{
    public class ErrorViewModel
    {
        public string? RequestId { get; set; }

        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }

    public class DynamicFormDto
    {
        public string FormName { get; set; }
        public string FileName { get; set; }   // ✅ ADD
        public int Version { get; set; }       // ✅ ADD
        public int? MainID { get; set; }       // ✅ OPTIONAL

        public string FormJson { get; set; }
        public string FormHtml { get; set; }

        public DateTime CreatedDate { get; set; }
    }

    public class FormListDto
    {
        public string FormName { get; set; }
        public string FileName { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CurrentStage { get; set; } // ✅ NEW
    }

    public class StageDto
    {
        public string name { get; set; }
        public bool isCompleted { get; set; }

        public Dictionary<string, JsonElement> values { get; set; } // ✅ NEW

        public List<FieldDto> fields { get; set; }
    }

    public class FieldDto
    {
        public string type { get; set; }
        public string label { get; set; }
    }

    public class SaveFormDataDto
    {
        public string FormName { get; set; }
        public Dictionary<string, string> Data { get; set; }
    }

    public class UpdateStageDto
    {
        public string FormName { get; set; }
        public int StageIndex { get; set; }
        public int Version { get; set; }

        public Dictionary<string, JsonElement> StageValues { get; set; } // ✅ FIXED
    }
}
