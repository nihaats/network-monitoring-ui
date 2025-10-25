# 1️⃣ Build aşaması
FROM node:20-alpine AS build
WORKDIR /app

# Önce package dosyalarını kopyala (cache optimizasyonu)
COPY package*.json ./
RUN npm ci

# Sonra kalan dosyaları kopyala
COPY . .
RUN npm run build -- --configuration production

# 2️⃣ Serve aşaması
FROM nginx:alpine

# Angular build çıktısını kopyala
COPY --from=build /app/dist/monitor-ui/browser /usr/share/nginx/html

# Nginx yapılandırmasını kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
