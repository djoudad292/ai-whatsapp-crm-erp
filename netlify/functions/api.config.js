export default {
  esbuild: {
    external: [
      "@nestjs/microservices",
      "@nestjs/websockets",
      "@grpc/grpc-js",
      "@grpc/proto-loader",
      "amqplib",
      "amqp-connection-manager",
      "nats",
      "kafkajs",
      "mqtt",
      "redis",
    ],
  },
};
