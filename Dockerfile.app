FROM node:lts

COPY [ "./", "/work/" ]

RUN cd /work && \
    npm install && \
    npm run build && \
    cp -rf build /app
    cd / && \
    rm -rf /work

WORKDIR /app
CMD ["node", "bundle.js"]
