About
Kling V2.6 (pro) Text to Video API.

The Kling V2.6 model is the latest generation of text-to-video with improved visual quality and motion consistency. This version also supports native audio generation when the sound parameter is enabled.

1. Calling the API
#
Install the client
#
The client provides a convenient way to interact with the model API.

npmyarnpnpmbun

npm install --save @fal-ai/client
Migrate to @fal-ai/client
The @fal-ai/serverless-client package has been deprecated in favor of @fal-ai/client. Please check the migration guide for more information.

Setup your API Key
#
Set FAL_KEY as an environment variable in your runtime.


export FAL_KEY="YOUR_API_KEY"
Submit a request
#
The client API handles the API submit protocol. It will handle the request status updates and return the result when the request is completed.


import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/kling-video/v2.6/pro/text-to-video", {
  input: {
    prompt: "Old friends reuniting at a train station after 20 years, one exclaims 'Is that really you?!' other tearfully replies 'I promised I'd come back, didn't I?', train whistle, steam hissing, emotional orchestral swell, crowd murmur"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
2. Authentication
#
The API uses an API Key for authentication. It is recommended you set the FAL_KEY environment variable in your runtime when possible.

API Key
#
In case your app is running in an environment where you cannot set environment variables, you can set the API Key manually as a client configuration.

import { fal } from "@fal-ai/client";

fal.config({
  credentials: "YOUR_FAL_KEY"
});
Protect your API Key
When running code on the client-side (e.g. in a browser, mobile app or GUI applications), make sure to not expose your FAL_KEY. Instead, use a server-side proxy to make requests to the API. For more information, check out our server-side integration guide.

3. Queue
#
Long-running requests
For long-running requests, such as training jobs or models with slower inference times, it is recommended to check the Queue status and rely on Webhooks instead of blocking while waiting for the result.

Submit a request
#
The client API provides a convenient way to submit requests to the model.


import { fal } from "@fal-ai/client";

const { request_id } = await fal.queue.submit("fal-ai/kling-video/v2.6/pro/text-to-video", {
  input: {
    prompt: "Old friends reuniting at a train station after 20 years, one exclaims 'Is that really you?!' other tearfully replies 'I promised I'd come back, didn't I?', train whistle, steam hissing, emotional orchestral swell, crowd murmur"
  },
  webhookUrl: "https://optional.webhook.url/for/results",
});
Fetch request status
#
You can fetch the status of a request to check if it is completed or still in progress.


import { fal } from "@fal-ai/client";

const status = await fal.queue.status("fal-ai/kling-video/v2.6/pro/text-to-video", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
  logs: true,
});
Get the result
#
Once the request is completed, you can fetch the result. See the Output Schema for the expected result format.


import { fal } from "@fal-ai/client";

const result = await fal.queue.result("fal-ai/kling-video/v2.6/pro/text-to-video", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b"
});
console.log(result.data);
console.log(result.requestId);
4. Files
#
Some attributes in the API accept file URLs as input. Whenever that's the case you can pass your own URL or a Base64 data URI.

Data URI (base64)
#
You can pass a Base64 data URI as a file input. The API will handle the file decoding for you. Keep in mind that for large files, this alternative although convenient can impact the request performance.

Hosted files (URL)
#
You can also pass your own URLs as long as they are publicly accessible. Be aware that some hosts might block cross-site requests, rate-limit, or consider the request as a bot.

Uploading files
#
We provide a convenient file storage that allows you to upload files and use them in your requests. You can upload files using the client API and use the returned URL in your requests.


import { fal } from "@fal-ai/client";

const file = new File(["Hello, World!"], "hello.txt", { type: "text/plain" });
const url = await fal.storage.upload(file);
Auto uploads
The client will auto-upload the file for you if you pass a binary object (e.g. File, Data).

Read more about file handling in our file upload guide.

5. Schema
#
Input
#
prompt string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

generate_audio boolean
Whether to generate native audio for the video. Supports Chinese and English voice output. Other languages are automatically translated to English. For English speech, use lowercase letters; for acronyms or proper nouns, use uppercase. Default value: true


{
  "prompt": "Old friends reuniting at a train station after 20 years, one exclaims 'Is that really you?!' other tearfully replies 'I promised I'd come back, didn't I?', train whistle, steam hissing, emotional orchestral swell, crowd murmur",
  "duration": "5",
  "aspect_ratio": "16:9",
  "negative_prompt": "blur, distort, and low quality",
  "cfg_scale": 0.5,
  "generate_audio": true
}
Output
#
video File
The generated video


{
  "video": {
    "file_size": 8195664,
    "file_name": "output.mp4",
    "content_type": "video/mp4",
    "url": "https://v3b.fal.media/files/b/0a84ab71/8hPbLs7n59WhWY-BN69yX_output.mp4"
  }
}
Other types
#
ImageToVideoV2MasterRequest
#
prompt string
image_url string
URL of the image to be used for the video

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

TextToVideoV21MasterRequest
#
prompt string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

ProImageToVideoRequest
#
prompt string
image_url string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

tail_image_url string
URL of the image to be used for the end of the video

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

TextToVideoV25ProRequest
#
prompt string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

ImageToVideoV21StandardRequest
#
prompt string
image_url string
URL of the image to be used for the video

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

ImageToVideoV25StandardRequest
#
prompt string
image_url string
URL of the image to be used for the video

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

FaceChoice
#
face_id string
ID of the face in the video. Returned by the identify_face API.

audio_url string
Publicly accessible URL to the audio file. Supported formats: .mp3, .wav, .m4a (max 5MB). Duration must be between 2–60 seconds.

sound_start_time integer
Start time (ms) for cropping the source audio. Must be between 0 and the audio duration. The cropped audio must remain at least 2 seconds long.

sound_end_time integer
End time (ms) for cropping the source audio. Must be greater than sound_start_time and within the original audio duration. The cropped segment must be at least 2 seconds long.

sound_insert_time integer
Time (ms) at which the cropped audio will be inserted into the video. Must meet both of the following conditions:

sound_insert_time must be within the duration of the video (it cannot be greater than the total video length).
The cropped audio segment must fully fit within the video when inserted — meaning sound_insert_time + cropped_sound_length must not exceed the video's total duration.
In other words: the insert point must be inside the video, and the inserted audio must not extend past the end of the video.

sound_volume float
Volume multiplier for the inserted audio. Range: [0, 2], where 1 = original volume. Default value: 1

original_audio_volume float
Volume multiplier for the video's original audio track. Range: [0, 2]. Has no effect if the source video contains no audio. Default value: 1

KlingV15ProImageToVideoRequest
#
prompt string
image_url string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

tail_image_url string
URL of the image to be used for the end of the video

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

static_mask_url string
URL of the image for Static Brush Application Area (Mask image created by users using the motion brush)

dynamic_masks list<DynamicMask>
List of dynamic masks

TextToVideoRequest
#
prompt string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

TextToVideoV2MasterRequest
#
prompt string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

FaceData
#
face_id string
The face id of video. When the same person's face is separated by more than 1 second in the video, it will be considered as different IDs.

face_image string
A schematic diagram of a face captured from a video (URL).

start_time integer
This face can be used as the starting time of lip-sync (milliseconds).

end_time integer
This face can be used as the ending time of lip-sync (milliseconds). Note: This value has a millisecond level error and will be longer than the actual ending time.

LipsyncA2VRequest
#
video_url string
The URL of the video to generate the lip sync for. Supports .mp4/.mov, ≤100MB, 2–10s, 720p/1080p only, width/height 720–1920px.

audio_url string
The URL of the audio to generate the lip sync for. Minimum duration is 2s and maximum duration is 60s. Maximum file size is 5MB.

File
#
url string
The URL where the file can be downloaded from.

content_type string
The mime type of the file.

file_name string
The name of the file. It will be auto-generated if not provided.

file_size integer
The size of the file in bytes.

file_data string
File data

V1TextToVideoRequest
#
prompt string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

camera_control CameraControlEnum
Camera control parameters

Possible enum values: down_back, forward_up, right_turn_forward, left_turn_forward

advanced_camera_control CameraControl
Advanced Camera control parameters

ImageToVideoRequest
#
prompt string
image_url string
duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

ImageToVideoV21MasterRequest
#
prompt string
image_url string
URL of the image to be used for the video

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

CameraControl
#
movement_type MovementTypeEnum
The type of camera movement

Possible enum values: horizontal, vertical, pan, tilt, roll, zoom

movement_value integer
The value of the camera movement

ImageToVideoV21ProRequest
#
prompt string
image_url string
URL of the image to be used for the video

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

tail_image_url string
URL of the image to be used for the end of the video

LipsyncT2VRequest
#
video_url string
The URL of the video to generate the lip sync for. Supports .mp4/.mov, ≤100MB, 2-60s, 720p/1080p only, width/height 720–1920px. If validation fails, an error is returned.

text string
Text content for lip-sync video generation. Max 120 characters.

voice_id VoiceIdEnum
Voice ID to use for speech synthesis

Possible enum values: genshin_vindi2, zhinen_xuesheng, AOT, ai_shatang, genshin_klee2, genshin_kirara, ai_kaiya, oversea_male1, ai_chenjiahao_712, girlfriend_4_speech02, chat1_female_new-3, chat_0407_5-1, cartoon-boy-07, uk_boy1, cartoon-girl-01, PeppaPig_platform, ai_huangzhong_712, ai_huangyaoshi_712, ai_laoguowang_712, chengshu_jiejie, you_pingjing, calm_story1, uk_man2, laopopo_speech02, heainainai_speech02, reader_en_m-v1, commercial_lady_en_f-v1, tiyuxi_xuedi, tiexin_nanyou, girlfriend_1_speech02, girlfriend_2_speech02, zhuxi_speech02, uk_oldman3, dongbeilaotie_speech02, chongqingxiaohuo_speech02, chuanmeizi_speech02, chaoshandashu_speech02, ai_taiwan_man2_speech02, xianzhanggui_speech02, tianjinjiejie_speech02, diyinnansang_DB_CN_M_04-v2, yizhipiannan-v1, guanxiaofang-v2, tianmeixuemei-v1, daopianyansang-v1, mengwa-v1

voice_language VoiceLanguageEnum
The voice language corresponding to the Voice ID Default value: "en"

Possible enum values: zh, en

voice_speed float
Speech rate for Text to Video generation Default value: 1

DynamicMask
#
mask_url string
URL of the image for Dynamic Brush Application Area (Mask image created by users using the motion brush)

trajectories list<Trajectory>
List of trajectories

ImageToVideoV25ProRequest
#
prompt string
image_url string
URL of the image to be used for the video

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

tail_image_url string
URL of the image to be used for the end of the video

VideoEffectsRequest
#
input_image_urls list<string>
URL of images to be used for hug, kiss or heart_gesture video.

effect_scene EffectSceneEnum
The effect scene to use for the video generation

Possible enum values: hug, kiss, heart_gesture, squish, expansion, fuzzyfuzzy, bloombloom, dizzydizzy, jelly_press, jelly_slice, jelly_squish, jelly_jiggle, pixelpixel, yearbook, instant_film, anime_figure, rocketrocket

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

MultiImageToVideoRequest
#
prompt string
input_image_urls list<string>
List of image URLs to use for video generation. Supports up to 4 images.

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

aspect_ratio AspectRatioEnum
The aspect ratio of the generated video frame Default value: "16:9"

Possible enum values: 16:9, 9:16, 1:1

negative_prompt string
Default value: "blur, distort, and low quality"

V1ImageToVideoRequest
#
prompt string
The prompt for the video

image_url string
URL of the image to be used for the video

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

cfg_scale float
The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt. Default value: 0.5

tail_image_url string
URL of the image to be used for the end of the video

static_mask_url string
URL of the image for Static Brush Application Area (Mask image created by users using the motion brush)

dynamic_masks list<DynamicMask>
List of dynamic masks

ImageToVideoV26ProRequest
#
prompt string
image_url string
URL of the image to be used for the video

duration DurationEnum
The duration of the generated video in seconds Default value: "5"

Possible enum values: 5, 10

negative_prompt string
Default value: "blur, distort, and low quality"

generate_audio boolean
Whether to generate native audio for the video. Supports Chinese and English voice output. Other languages are automatically translated to English. For English speech, use lowercase letters; for acronyms or proper nouns, use uppercase. Default value: true

Trajectory
#
x integer
X coordinate of the motion trajectory

y integer
Y coordinate of the motion trajectory

Related Models