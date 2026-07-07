import { Button } from "./Button";

interface PreviewModalProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  updatedAt?: string;
  downloadUrl?: string;
  onClose: () => void;
}

export function PreviewModal({
  title,
  subtitle,
  description,
  imageUrl,
  updatedAt,
  downloadUrl,
  onClose
}: PreviewModalProps) {
  return (
    <div className="preview-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="preview-modal__image">
          <img src={imageUrl} alt="" />
        </div>
        <div className="preview-modal__body">
          <div>
            <span>{subtitle}</span>
            <h2 id="preview-modal-title">{title}</h2>
          </div>
          {description ? <p>{description}</p> : null}
          {updatedAt ? (
            <dl className="preview-modal__meta">
              <div>
                <dt>Last Updated</dt>
                <dd>{updatedAt}</dd>
              </div>
            </dl>
          ) : null}
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
            {downloadUrl ? (
              <a className="button button--secondary" href={downloadUrl} download>
                Download
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
