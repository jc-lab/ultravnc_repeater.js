FROM node:lts

COPY [ "./", "/work/" ]

RUN cd /work && \
    npm install && \
    npm run build:full && \
    cp -rf build /app

RUN rm -rf /work

WORKDIR /app
CMD ["node", "app.js"]
