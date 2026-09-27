const milestones = [["2008", "Το πρώτο site στην Ελλάδα αφιερωμένο στις ακαδημίες"], ["2014", "Toumba FC και FootbALLabout"], ["2016", "Golden Cup και συνεργασία με Special Olympics Hellas"], ["2017", "Soccer X Camp"]] as const;

export function HomeHistorySection() {
  return <section className="home-history section-pad"><div><p className="eyebrow">05 / Η διαδρομή μας</p><h2>Ιδέες που έγιναν δράσεις.</h2></div><ol>{milestones.map(([year, title]) => <li key={`${year}-${title}`}><span>{year}</span><p>{title}</p></li>)}</ol></section>;
}
