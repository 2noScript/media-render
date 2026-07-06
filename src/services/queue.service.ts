import amqp from "amqplib";
import { OpenCutRenderService } from "./render.service";

export class QueueService {
  private connection!: any;
  private channel!: any;
  private renderService = new OpenCutRenderService();

  public async connect() {
    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    this.connection = await amqp.connect(rabbitUrl);
    this.channel = await this.connection.createChannel();
    
    const queueName = "video-render-tasks";
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.prefetch(1); // Chỉ xử lý 1 task tại một thời điểm để tránh quá tải CPU

    this.channel.consume(queueName, async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[Queue] Received render task for project: ${payload.projectId}`);
        
        // Thực thi render
        await this.renderService.renderProject(payload);
        
        this.channel.ack(msg);
        console.log(`[Queue] Task completed successfully!`);
      } catch (err) {
        console.error("[Queue] Error processing render task:", err);
        // Nack và đưa lại vào queue hoặc đánh dấu lỗi tùy thuộc vào yêu cầu nghiệp vụ
        this.channel.nack(msg, false, false); 
      }
    });
  }
}
