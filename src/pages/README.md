For pages

# Header
    <!--HEADER-->
    <div id="header"></div>
    <script>
      fetch('../header.html')
        .then(response => response.text())
        .then(data => { document.getElementById('header').innerHTML = data; });
    </script>

# Footer
    <!-- FOOTER -->
     <div id="footer"></div>
      <script>
        fetch('../footer.html')
          .then(response => response.text())
          .then(data => { document.getElementById('footer').innerHTML = data; });
      </script>
