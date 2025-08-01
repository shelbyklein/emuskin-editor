var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-wLuxJ5/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCORSHeaders(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    try {
      if (url.pathname === "/upload-url" && request.method === "POST") {
        return await handleUploadUrl(request, env, corsHeaders);
      }
      if (url.pathname.startsWith("/upload/") && request.method === "PUT") {
        const uploadId = url.pathname.split("/")[2];
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
function getCORSHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim());
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
    return {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true"
    };
  }
  return {
    "Access-Control-Allow-Origin": allowedOrigins[0] || "null",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
__name(getCORSHeaders, "getCORSHeaders");
async function handleUploadUrl(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { projectId, fileName, fileType, imageType = "background", orientation = "portrait" } = body;
    if (!projectId || !fileName || !fileType) {
      return new Response(JSON.stringify({
        error: "Missing required fields: projectId, fileName, fileType"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
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
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `projects/${projectId}/${imageType}/${orientation}/${timestamp}-${sanitizedFileName}`;
    const uploadId = crypto.randomUUID();
    if (env.IMAGE_METADATA) {
      await env.IMAGE_METADATA.put(
        `upload:${uploadId}`,
        JSON.stringify({
          key,
          projectId,
          fileType,
          imageType,
          orientation,
          timestamp,
          expires: Date.now() + 3e5
          // 5 minutes
        }),
        { expirationTtl: 300 }
        // Expire after 5 minutes
      );
    }
    const workerUrl = new URL(request.url).origin;
    return new Response(JSON.stringify({
      uploadUrl: `${workerUrl}/upload/${uploadId}`,
      publicUrl: `${env.R2_PUBLIC_URL || "https://pub-unknown.r2.dev"}/${key}`,
      key,
      uploadId,
      expires: new Date(Date.now() + 3e5).toISOString()
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
__name(handleUploadUrl, "handleUploadUrl");
async function handleUpload(request, env, uploadId, corsHeaders) {
  try {
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
    const blob = await request.blob();
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
    if (env.IMAGE_METADATA && metadata) {
      await env.IMAGE_METADATA.delete(`upload:${uploadId}`);
    }
    return new Response(JSON.stringify({
      success: true,
      key,
      publicUrl: `${env.R2_PUBLIC_URL || "https://pub-unknown.r2.dev"}/${key}`
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
__name(handleUpload, "handleUpload");
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
__name(handleDelete, "handleDelete");
async function handleList(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return new Response(JSON.stringify({
        error: "Missing projectId parameter"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const prefix = `projects/${projectId}/`;
    const list = await env.R2_BUCKET.list({ prefix, limit: 1e3 });
    const images = list.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      publicUrl: `${env.R2_PUBLIC_URL || "https://pub-unknown.r2.dev"}/${obj.key}`,
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
__name(handleList, "handleList");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-wLuxJ5/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-wLuxJ5/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
