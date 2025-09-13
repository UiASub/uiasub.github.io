# UiASub Website

This repository contains the source code for UiASub's website. The site is built with HTML, CSS (Bootstrap, Tailwind CSS, custom styles), and JavaScript, and is designed to showcase UiASub's projects, sponsors, and activities.

## Quick Start

1. **Clone the repository:**

    ```sh
    git clone https://github.com/UiASub/uiasub.github.io.git
    cd uiasub.github.io
    ```

2. **Preview locally:**

    - Double-click `index.html` to open in your browser, or for best results run a local server:

    ```sh
    python3 -m http.server
    # Then visit http://localhost:8000 in your browser
    ```

## Project Structure

- `index.html` — Main landing page that welcomes users and introduces the website.
- `footer.html` — Contains the website footer with navigation links
- `header.html` — Features the website header
- `css/` — Stylesheets (Bootstrap, custom styles)
- `js/` — JavaScript files
- `images/` — Images and logos
- `fonts/` — Font files
- `pages/` — Additional static pages
- `posts/` — Blog/news posts or Instagram embeds

## CSS Information

- **Tailwind CSS**: Integrated for utility-first styling, enabling rapid design changes.
- **Custom CSS**: Located in `css/custom.css`, includes:
  - Custom animations like `underwater` for carousel slides.
  - Gradient backgrounds applied to specific slides.
  - Integration with Tailwind CSS for utility-based styling.
- **Wave Effects**: Implemented using `css/waves.css` for SVG-based animations.
- **Image Sources**: Background images and assets are generated using [Haikei](https://app.haikei.app/).

## Development

1. Edit HTML files for content changes.
2. Edit `css/custom.css` for custom styles.
3. Edit `js/` for JavaScript functionality.
4. All changes can be previewed locally before pushing.

## Contributing

1. Fork this repository to your own GitHub account.
2. Create a new branch for your changes:

    ```sh
    git checkout -b my-feature-branch
    ```

3. Make your changes and commit them:

    ```sh
    git add .
    git commit -m "Describe your changes"
    ```

4. Push to your fork:

    ```sh
    git push origin my-feature-branch
    ```

5. Open a Pull Request to the main repository.

## Contact

- Email: <uia.submerged@gmail.com>
- Instagram: [uia.sub](https://www.instagram.com/uia.sub/)
- LinkedIn: [UiASub](https://no.linkedin.com/company/uiasub)

---

Forked from the Netflix OSS Hub: <http://netflix.github.io/>

© UiASub — Exploring the depths, engineering the future!
