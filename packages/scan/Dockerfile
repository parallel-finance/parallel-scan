FROM node:14.17
COPY releases/ /parallel-scan
COPY package.json /parallel-scan
WORKDIR /parallel-scan

RUN yarn install --prod
RUN echo '#!/bin/bash\nnode index.js $@' > ./entrypoint.sh
RUN chmod u+x ./entrypoint.sh

ENTRYPOINT ["/parallel-scan/entrypoint.sh"]
