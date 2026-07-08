'use client';

import { useState } from 'react';
import { Card, Badge } from './ui/index';
import styles from './MedicalInfoCard.module.css';

export default function MedicalInfoCard({
  id,
  icon,
  title,
  summary,
  description,
  riskLevel,
  tags,
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const riskVariants = {
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'success',
  };

  const riskLabels = {
    HIGH: 'Rủi ro cao',
    MEDIUM: 'Rủi ro trung bình',
    LOW: 'Rủi ro thấp',
  };

  return (
    <Card
      className={styles.card}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.icon}>{icon}</div>
        {riskLevel && (
          <Badge variant={riskVariants[riskLevel]}>
            {riskLabels[riskLevel]}
          </Badge>
        )}
      </div>

      {/* Title */}
      <h3 className={styles.title}>{title}</h3>

      {/* Summary */}
      <p className={styles.summary}>{summary}</p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className={styles.tags}>
          {tags.slice(0, 3).map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className={styles.cta}>
        <span>Xem chi tiết</span>
        <span className={styles.arrow}>→</span>
      </div>
    </Card>
  );
}
