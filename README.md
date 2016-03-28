# Getting started
The `marvelous-query-language` (`MQL`) is an open source domain specific language built on top of <code>.NET</code> platform. 
It has been designed to help semi-technical users filter large data sources. To be as user-friendly as possible it offers
auto completions. 

If you would like to use it along with Aurelia checkout
[https://github.com/MarvelousSoftware/marvelous-aurelia-query-language](this) project. 

Project documentation: [http://marvelous.software/docs.html#/query-language](http://marvelous.software/docs.html#/query-language)

.NET backend source code: https://github.com/MarvelousSoftware/MarvelousSoftwareDotNet

## Installation
The `marvelous-query-language` consists of 2 packages: client side and server side. First install client side library:
```
jspm install marvelous-query-language
```
Then load the css file:
```javascript
import 'marvelous-aurelia-query-language/styles/default.css!';
```
To install server side part of the library use following NuGet install command:
```
Install-Package MarvelousSoftware.QueryLanguage
```
Once you do that install either `MarvelousSoftware.Core.Host.Owin` or `MarvelousSoftware.Core.Host.SystemWeb` NuGet package and use 
it on the application start up:
```csharp
using System.Web;
using MarvelousSoftware.Core.Host.SystemWeb;

namespace MarvelousSoftware.Examples.API
{
    public class WebApiApplication : HttpApplication
    {
        protected void Application_Start()
        {
            // This line allows to use MarvelousSoftware products with SystemWeb
            // It comes from MarvelousSoftware.Core.Host.SystemWeb package
            MarvelousSoftwareHost.UseSystemWeb();
            
            // If you would like to use MarvelousSoftware products with more modern, Owin based applications
            // then use MarvelousSoftware.Core.Host.Owin package and place below line in Startup.cs file 
            // app.UseMarvelousSoftware();
            
            //.. rest of app's startup configuration
        }
    }
}
```
Now you are ready to go.

## Browser support
All modern browsers and IE >= 9.

## License
MIT