# Redis keys

|`l@l:{liveId}`|STRING|ライブの情報|
|`p@;:{liveId}`|STRING|ライブのプレイリスト|
|`c@l:{liveId}`|LIST|ライブのコメントJSONのリスト|
|`v@l:{liveId}:v:{viewerId}`|STRING|'1' with expiry|
