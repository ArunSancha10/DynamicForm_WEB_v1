using Microsoft.AspNetCore.Mvc;

namespace DynamicMaster.WEB.Controllers.DynamicForm
{
    public class DynamicFormController : Controller
    {
        public IActionResult DynamicFormIndex()
        {
            return View();
        }
    }
}
