import React, { useMemo } from 'react';
import { filterEquityMenuItems } from '../../constants/governanceConstants';
import {
  equityManagerMenuItems,
  EQUITY_CATEGORY_ORDER,
  EQUITY_MENU_CATEGORIES,
} from './Sidebar';
import landingBg from './assets/equity-landing-bg.png';
import './Styles/EquityLanding.css';

const EquityLanding = ({ user, onOpenModule }) => {
  const modules = useMemo(() => {
    const accessible = filterEquityMenuItems(user, equityManagerMenuItems);
    const byCategory = new Map();

    accessible.forEach((item) => {
      const category = EQUITY_MENU_CATEGORIES[item.name] || 'Overview';
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category).push(item);
    });

    return EQUITY_CATEGORY_ORDER.map((category) => {
      const items = byCategory.get(category) || [];
      if (!items.length) return null;
      return { category, items };
    }).filter(Boolean);
  }, [user]);

  const openItem = (item) => {
    const firstTab = item.subTopics?.[0];
    if (firstTab) onOpenModule?.(firstTab);
  };

  return (
    <section className="eq-landing" aria-label="Equity Manager home">
      <img src={landingBg} alt="" className="eq-landing__bg" />
      <div className="eq-landing__veil" aria-hidden="true" />

      <div className="eq-landing__panel">
        <p className="eq-landing__kicker">Equity Manager</p>

        <div className="eq-landing__grid">
          {modules.map(({ category, items }) => (
            <article key={category} className="eq-landing-card">
              <h2 className="eq-landing-card__title">{category}</h2>
              <ul className="eq-landing-card__list">
                {items.map((item) => (
                  <li key={item.name}>
                    <button
                      type="button"
                      className="eq-landing-card__link"
                      onClick={() => openItem(item)}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EquityLanding;
