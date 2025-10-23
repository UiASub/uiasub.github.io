# Pages

Guidance for adding pages to the site.

## Header

Include the dynamic header placeholder and the shared header loader script:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="UiASub">
    <meta name="title" content="UiASub XXXX">
    <link rel="shortcut icon" href="/images/uiasub/Icon1.png">

    <title>UiASub XXXX</title>

    <!-- Bootstrap core CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="" crossorigin="anonymous">

    <!-- Custom styles for this template -->
    <link href="/css/custom.css" rel="stylesheet">
    <link href="/css/header.css" rel="stylesheet">
    <link rel="stylesheet" href="/css/waves.css">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
  </head>

  <body>
    <!--HEADER-->
    <div id="header"></div>
    <script src="/js/header.js"></script>
```

## Footer

Include the footer placeholder and the small fetch snippet used across pages:

```html
    
    <!-- FOOTER -->
    <div id="footer"></div>
    <script>
      fetch('/footer.html')
        .then(response => response.text())
        .then(data => { document.getElementById('footer').innerHTML = data; });
    </script>
    <!-- Bootstrap core JavaScript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    </body>
</html>
```
