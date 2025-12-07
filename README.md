# NoS TechStore - E-commerce Platform

## Overview

NoS TechStore is a modern e-commerce application designed for selling technology products. It features a robust Spring Boot backend and a sleek React frontend, providing users with a fast and responsive shopping experience.

**Deployment URL:** [https://techstore.kieutung.online](https://techstore.kieutung.online)

## Technology Stack

- **Backend:** Java Spring Boot
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Database:** PostgreSQL
- **Caching:** Redis
- **Message Broker:** RabbitMQ
- **Image Storage:** Cloudinary
- **Build Tools:** Maven, npm/Bun

## Features Checklist

### Customer Features

- [x] **Product Browsing:** Search and filter products by category, price, brand.
- [x] **Product Details:** View detailed specs, images, and reviews.
- [x] **Shopping Cart:** Add/remove items, update quantities.
- [x] **Checkout:** Secure checkout process with order summary.
- [x] **User Account:** Order history, profile management.

### Admin Features

- [x] **Product Management:** CRUD operations for products.
- [x] **Order Management:** View and update order status.
- [x] **User Management:** Manage customer accounts.
- [x] **Inventory Management:** Track stock levels.

## Setup & Deployment

### Prerequisites

- Java 17+
- Node.js & npm
- Docker
- Redis
- RabbitMQ

### Local Development

1. **Backend:**

   ```bash
   cd backend_api
   ./mvnw spring-boot:run
   ```

   API runs on port 8080.

2. **Frontend:**

   ```bash
   cd tech-zen-ui
   npm install
   npm run dev
   ```

   UI runs on port 5173.

### Docker Build

To build the Docker images:

```bash
./build.sh
```

### Kubernetes Deployment

Deploy to the `techstore` namespace:

```bash
kubectl apply -f ../Stack_YAML/namespaces.yaml
kubectl apply -f ../Stack_YAML/techstore-stack.yaml
```
