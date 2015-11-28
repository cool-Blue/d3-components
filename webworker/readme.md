## Using D3 in web workers
### postMessage serialising
Two versions are tried for passing non-transferable objects 
  1. Use `JSON.stringify` to process the object before passing to `postMessage`
  1. Pass the raw object with methods stripped off  
  
The relative performance varies depending on the browser used, Mozilla and IE don't have significant difference in performance, but Chrome is much slower if the objects are not serialised first