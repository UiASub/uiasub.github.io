# Pages

Guidance for adding pages to the site.

## Header

Include the dynamic header placeholder and the shared header loader script:

```html
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
```
