# Etapa de build: compila el frontend
FROM node:20 AS build
WORKDIR /app

# Copiamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# Construimos la versión de producción
RUN npm run build

# Etapa de producción: servimos con Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copiamos los archivos estáticos generados por CRA
COPY --from=build /app/build .

# Copia a nginx los archivos nuevos generados
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto
EXPOSE 80

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
