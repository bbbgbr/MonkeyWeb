FROM node:jessie
RUN useradd -ms /bin/bash server
RUN apt-get update && apt install -y vim
COPY . /home/server/app
WORKDIR /home/server/app
RUN chown -R server:server /home/server/app
RUN chmod 755 /home/server/app
USER server
RUN npm install && npm run build
CMD [ "node", "dist/bundle.js" ]