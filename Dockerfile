FROM node:18

#Puppeteer
RUN apt-get update
RUN apt-get install -y libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 libgbm-dev libnss3-dev libxss-dev libasound2
RUN npx --yes puppeteer browsers install chrome

#Copy front & back
COPY front /app/front
COPY back /app/back

#Frontend
WORKDIR /app/front
RUN npm install
RUN npm run build



#Backend
WORKDIR /app/back

RUN npm install

#Expose port 3000
EXPOSE 3000

#Run entrypoint
WORKDIR /app
COPY entrypoint.sh /app
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
