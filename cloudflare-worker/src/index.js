/**
 * Cloudflare Worker for handling R2 image uploads
 * Provides presigned URLs and manages image storage
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Always handle CORS
    const corsHeaders = getCORSHeaders(request, env);
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // Route handling
      if (url.pathname === "/upload-url" && request.method === "POST") {
        return await handleUploadUrl(request, env, corsHeaders);
      }
      
      if (url.pathname.startsWith("/upload/") && request.method === "PUT") {
        const uploadId = url.pathname.split('/')[2];
        return await handleUpload(request, env, uploadId, corsHeaders);
      }
      
      if (url.pathname === "/delete" && request.method === "DELETE") {
        return await handleDelete(request, env, corsHeaders);
      }
      
      if (url.pathname === "/list" && request.method === "GET") {
        return await handleList(request, env, corsHeaders);
      }
      
      return new Response("Not Found", { 
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ 
        error: error.message || "Internal Server Error" 
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
};

/**
 * Get CORS headers
 */
function getCORSHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim());
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
    return {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true"
    };
  }
  
  // Return minimal headers if origin not allowed
  return {
    "Access-Control-Allow-Origin": allowedOrigins[0] || "null",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

/**
 * Generate a presigned URL for uploading
 */
async function handleUploadUrl(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { projectId, fileName, fileType, imageType = "background", orientation = "portrait", userEmail, controlId } = body;
    
    // Validate inputs
    if (!projectId || !fileName || !fileType || !userEmail) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: projectId, fileName, fileType, userEmail" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        }
      });
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(fileType)) {
      return new Response(JSON.stringify({ 
        error: "Invalid file type. Allowed: " + allowedTypes.join(", ") 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        }
      });
    }

    // Generate key based on image type
    let key;
    if (imageType === "thumbstick" && controlId) {
      key = `${userEmail}/${projectId}/thumbstick-${controlId}.png`;
    } else {
      // For background images, use orientation as filename
      key = `${userEmail}/${projectId}/${orientation}.png`;
    }

    // Generate upload ID
    const uploadId = crypto.randomUUID();
    
    // Store upload metadata in KV (if available)
    if (env.IMAGE_METADATA) {
      await env.IMAGE_METADATA.put(
        `upload:${uploadId}`,
        JSON.stringify({
          key,
          projectId,
          fileType,
          imageType,
          orientation,
          userEmail,
          controlId,
          expires: Date.now() + 300000 // 5 minutes
        }),
        { expirationTtl: 300 } // Expire after 5 minutes
      );
    }

    // Get the worker URL from the request
    const workerUrl = new URL(request.url).origin;

    return new Response(JSON.stringify({
      uploadUrl: `${workerUrl}/upload/${uploadId}`,
      publicUrl: `${env.R2_PUBLIC_URL || 'https://pub-unknown.r2.dev'}/${key}`,
      key,
      uploadId,
      expires: new Date(Date.now() + 300000).toISOString()
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in handleUploadUrl:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to generate upload URL: " + error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}

/**
 * Handle actual file upload
 */
async function handleUpload(request, env, uploadId, corsHeaders) {
  try {
    // Get metadata if KV is available
    let metadata = null;
    if (env.IMAGE_METADATA) {
      const metadataStr = await env.IMAGE_METADATA.get(`upload:${uploadId}`);
      if (!metadataStr) {
        return new Response(JSON.stringify({ 
          error: "Invalid or expired upload ID" 
        }), {
          status: 403,
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          }
        });
      }
      metadata = JSON.parse(metadataStr);
      
      // Check expiration
      if (metadata.expires < Date.now()) {
        return new Response(JSON.stringify({ 
          error: "Upload URL expired" 
        }), {
          status: 403,
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          }
        });
      }
    }

    // Get file data
    const blob = await request.blob();
    
    // Validate file size
    const maxSize = parseInt(env.MAX_FILE_SIZE || "10485760");
    if (blob.size > maxSize) {
      return new Response(JSON.stringify({ 
        error: `File too large. Maximum size: ${maxSize / 1048576}MB` 
      }), {
        status: 413,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        }
      });
    }

    // Upload to R2
    const key = metadata ? metadata.key : `uploads/${uploadId}`;
    await env.R2_BUCKET.put(key, blob, {
      httpMetadata: {
        contentType: request.headers.get("Content-Type") || metadata?.fileType || "application/octet-stream"
      },
      customMetadata: metadata ? {
        projectId: metadata.projectId,
        imageType: metadata.imageType,
        orientation: metadata.orientation,
        uploadId
      } : {}
    });

    // Clean up metadata
    if (env.IMAGE_METADATA && metadata) {
      await env.IMAGE_METADATA.delete(`upload:${uploadId}`);
    }

    return new Response(JSON.stringify({
      success: true,
      key,
      publicUrl: `${env.R2_PUBLIC_URL || 'https://pub-unknown.r2.dev'}/${key}`
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in handleUpload:", error);
    return new Response(JSON.stringify({ 
      error: "Upload failed: " + error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}

/**
 * Delete an image
 */
async function handleDelete(request, env, corsHeaders) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return new Response(JSON.stringify({ 
        error: "Missing key parameter" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        }
      });
    }

    await env.R2_BUCKET.delete(key);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Image deleted successfully"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in handleDelete:", error);
    return new Response(JSON.stringify({ 
      error: "Delete failed: " + error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}

/**
 * List images for a project
 */
async function handleList(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const userEmail = url.searchParams.get("userEmail");
    
    if (!projectId || !userEmail) {
      return new Response(JSON.stringify({ 
        error: "Missing required parameters: projectId, userEmail" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        }
      });
    }

    const prefix = `${userEmail}/${projectId}/`;
    const list = await env.R2_BUCKET.list({ prefix, limit: 1000 });

    const images = list.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      publicUrl: `${env.R2_PUBLIC_URL || 'https://pub-unknown.r2.dev'}/${obj.key}`,
      metadata: obj.customMetadata
    }));

    return new Response(JSON.stringify({ 
      images,
      truncated: list.truncated,
      count: images.length
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in handleList:", error);
    return new Response(JSON.stringify({ 
      error: "List failed: " + error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}