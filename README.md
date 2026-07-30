# eCafe Web

## Description
A scalable front-end project for eCafe built with plain HTML, CSS, and JavaScript.

## Folder structure
```text
ecafe-web
├── index.html
├── login.html
├── README.md
├── .gitignore
├── assets
│   ├── css
│   ├── js
│   ├── images
│   ├── icons
│   └── favicon
├── components
├── pages
│   ├── home
│   ├── products
│   ├── categories
│   └── admin
├── services
├── guards
└── docs
```

## How to run
1. Open the project folder in your browser.
2. Start with `index.html` or use a live server extension for a better development experience.

## Technologies
- HTML5
- CSS3
- Vanilla JavaScript

## Directory responsibilities
- `assets/`: static files such as styles, scripts, images, and icons.
- `components/`: reusable HTML partials like header, footer, and sidebar.
- `pages/`: route-oriented page folders for the main application views.
- `services/`: central place for HTTP integration and API communication.
- `guards/`: authentication and route protection logic.
- `docs/`: project documentation and notes.

## Future API integration
The structure was organized to support future integration with a Java Spring Boot backend through the `services/` layer.
