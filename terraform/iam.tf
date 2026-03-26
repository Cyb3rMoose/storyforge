# ── Policy: scoped access to the media bucket only ───────────────────────────
# Attach this to the existing dev IAM user (or any Lambda execution role later)

data "aws_iam_policy_document" "media_bucket_access" {
  # Read + write generated media files
  statement {
    sid    = "MediaBucketReadWrite"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]

    resources = ["${aws_s3_bucket.media.arn}/jobs/*"]
  }

  # List the bucket (needed to check if objects exist)
  statement {
    sid    = "MediaBucketList"
    effect = "Allow"

    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.media.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["jobs/*"]
    }
  }
}

resource "aws_iam_policy" "media_bucket_access" {
  name        = "${var.project_name}-media-bucket-access"
  description = "Least-privilege access to the StoryForge media S3 bucket"
  policy      = data.aws_iam_policy_document.media_bucket_access.json
}

# Attach the policy to the existing dev IAM user
data "aws_iam_user" "dev" {
  user_name = var.iam_dev_user_name
}

resource "aws_iam_user_policy_attachment" "dev_media_access" {
  user       = data.aws_iam_user.dev.user_name
  policy_arn = aws_iam_policy.media_bucket_access.arn
}


# ── Policy: Polly (TTS) — scoped to SynthesizeSpeech only ────────────────────

data "aws_iam_policy_document" "polly_synthesise" {
  statement {
    sid    = "PollySynthesise"
    effect = "Allow"

    actions   = ["polly:SynthesizeSpeech"]
    resources = ["*"] # Polly does not support resource-level restrictions
  }
}

resource "aws_iam_policy" "polly_synthesise" {
  name        = "${var.project_name}-polly-synthesise"
  description = "Allow SynthesizeSpeech only — no Polly admin actions"
  policy      = data.aws_iam_policy_document.polly_synthesise.json
}

resource "aws_iam_user_policy_attachment" "dev_polly" {
  user       = data.aws_iam_user.dev.user_name
  policy_arn = aws_iam_policy.polly_synthesise.arn
}
