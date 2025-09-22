const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Cre8 Video Worker',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Process video endpoint
app.post('/process', async (req, res) => {
  try {
    // Validate authorization
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.WORKER_SECRET;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedSecret) {
      return res.status(401).json({ error: 'Invalid authorization' });
    }

    const { job_id, webhook_url, webhook_secret, ...jobPayload } = req.body;

    if (!job_id || !webhook_url || !webhook_secret) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Respond immediately that we've received the job
    res.json({ 
      success: true, 
      message: 'Job received and processing started',
      job_id 
    });

    // Start processing in background
    processVideoJob(job_id, jobPayload, webhook_url, webhook_secret);

  } catch (error) {
    console.error('Process endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel job endpoint
app.post('/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.WORKER_SECRET;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedSecret) {
      return res.status(401).json({ error: 'Invalid authorization' });
    }

    const { job_id } = req.body;
    console.log(`Cancel request received for job ${job_id}`);
    
    // For now, just acknowledge the cancel request
    res.json({ success: true, message: 'Cancel request acknowledged' });
  } catch (error) {
    console.error('Cancel endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Background video processing function
async function processVideoJob(jobId, payload, webhookUrl, webhookSecret) {
  try {
    console.log(`Starting processing for job ${jobId}`);
    
    // Send "running" status
    await sendWebhook(webhookUrl, webhookSecret, {
      job_id: jobId,
      status: 'running',
      progress: 0.1,
      message: 'Video processing started'
    });

    // Simulate processing stages
    const stages = [
      { progress: 0.2, message: 'Downloading source video...' },
      { progress: 0.4, message: 'Analyzing video content...' },
      { progress: 0.6, message: 'Applying transformations...' },
      { progress: 0.8, message: 'Adding effects and audio...' },
      { progress: 0.9, message: 'Generating thumbnails...' }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      await sendWebhook(webhookUrl, webhookSecret, {
        job_id: jobId,
        status: 'running',
        progress: stage.progress,
        message: stage.message
      });
    }

    // Simulate final export
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await sendWebhook(webhookUrl, webhookSecret, {
      job_id: jobId,
      status: 'exporting',
      progress: 0.95,
      message: 'Finalizing and uploading...'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock result with realistic URLs
    const mockResult = {
      clips: [
        {
          url_mp4: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4",
          url_hls: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.m3u8",
          thumbs: [
            "https://via.placeholder.com/1080x1920/4A90E2/FFFFFF?text=Cre8+Video+1",
            "https://via.placeholder.com/1080x1920/50C878/FFFFFF?text=Cre8+Video+2",
            "https://via.placeholder.com/1080x1920/FF6B6B/FFFFFF?text=Cre8+Video+3"
          ],
          subtitle_vtt: "https://example.com/subtitles.vtt",
          duration_sec: 60,
          aspect: payload.transform?.layout?.aspect || "9:16",
          filesize_bytes: 15728640
        }
      ]
    };

    // Send completion status
    await sendWebhook(webhookUrl, webhookSecret, {
      job_id: jobId,
      status: 'completed',
      progress: 1.0,
      message: 'Video processing completed successfully',
      assets: mockResult,
      summary: {
        processing_time_sec: 15,
        input_duration: 120,
        output_clips: 1,
        total_filesize: 15728640
      }
    });

    console.log(`Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    
    // Send failure status
    await sendWebhook(webhookUrl, webhookSecret, {
      job_id: jobId,
      status: 'failed',
      error: error.message,
      message: 'Video processing failed'
    });
  }
}

// Webhook sender function
async function sendWebhook(webhookUrl, webhookSecret, payload) {
  try {
    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      timeout: 10000
    });
    console.log(`Webhook sent: ${payload.status} for job ${payload.job_id}`);
  } catch (error) {
    console.error('Webhook send failed:', error.message);
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cre8 Video Worker running on port ${PORT}`);
  console.log('Required environment variables:');
  console.log('- WORKER_SECRET:', process.env.WORKER_SECRET ? '✓ Set' : '✗ Missing');
  console.log('Health check available at: http://localhost:' + PORT + '/');
});
